import { XcodeSwiftPlaygroundCreationParameters } from "../models/swift-playground/xcode-swift-playground-creation-parameters.model";
import { XcodeSwiftPlayground } from "../models/swift-playground/xcode-swift-playground.model";
import { XcodeSwiftPlaygroundPlatform } from "../models/swift-playground/xcode-swift-playground-platform.model";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { execAsync } from "../shared/exec-async";
import * as os from "os";
import dedent from "dedent";
import { XcodeSwiftPlaygroundTemplate } from "../models/swift-playground/xcode-swift-playground-template.model";

const makeDirectory = promisify(fs.mkdir);
const removeDirectory = promisify(fs.rm);
const writeFile = promisify(fs.writeFile);

/**
 * XcodeSwiftPlaygroundService
 */
export class XcodeSwiftPlaygroundService {

  /**
   * The scaffold Swift Playground TemplateFiles
   */
  private scaffoldTemplateFiles: TemplateFile[] = [
    {
      name: "timeline",
      extension: "xctimeline",
      contents: `
      <?xml version="1.0" encoding="UTF-8"?>
      <Timeline version="3.0">
         <TimelineItems>
         </TimelineItems>
      </Timeline>
      `
    },
    {
      path: "playground.xcworkspace",
      name: "contents",
      extension: "xcworkspacedata",
      contents: `
      <?xml version="1.0" encoding="UTF-8"?>
      <Workspace version="1.0">
        <FileRef location="group:self:">
        </FileRef>
      </Workspace>
      `
    }
  ];

  /**
   * Create a new Swift Playground
   * @param parameters The XcodeSwiftPlaygroundCreationParameters
   */
  async createSwiftPlayground(
    parameters: XcodeSwiftPlaygroundCreationParameters
  ): Promise<XcodeSwiftPlayground> {
    // Initialize Playground Path
    const playgroundPath = path.join(
      // Replace tilde (~) with home directory
      parameters.location.replace(/^~/, os.homedir()),
      `${parameters.name}.playground`
    );
    // Check if Playground already exists
    if (fs.existsSync(playgroundPath)) {
      // Return existing Swift Playground
      return {
        name: parameters.name,
        path: playgroundPath,
        alreadyExists: true,
        open: () => {
          return execAsync(
            `open ${playgroundPath}`
          ).then();
        }
      };
    }
    // Make playground directory
    await makeDirectory(playgroundPath);
    // Initialize template files
    const templateFiles = [
      ...this.scaffoldTemplateFiles,
      this.swiftSourceContentsTemplateFile(
        parameters.template
      ),
      this.contentsTemplateFile(
        parameters.platform
      )
    ];
    try {
      // Create TemplateFiles in parallel
      await Promise.all(
        templateFiles
          .map(async templateFile => {
            // Initialize file path with current playground path
            let filePath = playgroundPath;
            // Check if template file has a path
            if (templateFile.path) {
              // Join current file path with template file path
              filePath = path.join(
                filePath,
                templateFile.path
              );
              // Make directory
              await makeDirectory(filePath);
            }
            // Join current file path with file name
            filePath = path.join(
              filePath,
              [
                templateFile.name,
                templateFile.extension
              ].join(".")
            );
            // Write file
            await writeFile(
              filePath,
              dedent(templateFile.contents)
            );
          })
      );
    } catch (error) {
      try {
        // On error perform rollback
        // Try to remove the playground directory
        await removeDirectory(
          playgroundPath,
          { recursive: true }
        );
      } catch (error) {
        // Log and ignore this error
        // As we only try to clean up the Playground directory
        // in case of an error
        console.error(error);
      }
      // Re-Throw Error
      throw error;
    }
    // Return Playground
    return {
      name: parameters.name,
      path: playgroundPath,
      alreadyExists: false,
      open: () => {
        return execAsync(
          `open ${playgroundPath}`
        ).then();
      }
    };
  }

  /**
   * The XCPlayground contents TemplateFile
   * @param platform The XcodeSwiftPlaygroundPlatform
   * @private
   */
  private contentsTemplateFile(
    platform: XcodeSwiftPlaygroundPlatform
  ): TemplateFile {
    return {
      name: "contents",
      extension: "xcplayground",
      contents: `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <playground version='5.0' 
                  target-platform='${platform.toLocaleLowerCase()}' 
                  buildActiveScheme='true' 
                  executeOnSourceChanges='false' 
                  importAppTypes='true'>
          <timeline fileName='timeline.xctimeline'/>
      </playground>
      `
    };
  }

  /**
   * Swift Source Contents TemplateFile
   * @param template The XcodeSwiftPlaygroundTemplate
   */
  private swiftSourceContentsTemplateFile(
    template: XcodeSwiftPlaygroundTemplate
  ): TemplateFile {
    let contents: string;
    switch (template) {
      case XcodeSwiftPlaygroundTemplate.empty:
        contents = "import Foundation\n\n";
        break;
      case XcodeSwiftPlaygroundTemplate.swiftUI:
        contents = `
        import PlaygroundSupport
        import SwiftUI
        
        struct ContentView: View {
        
            var body: some View {
                Text("Hello World")
            }
            
        }
        
        PlaygroundPage.current.liveView = UIHostingController(rootView: ContentView())
        `;
        break;
    }
    return {
      name: "Contents",
      extension: "swift",
      contents: contents
    };
  }

}

/**
 * A Template File
 */
interface TemplateFile {
  /**
   * The optional path
   */
  path?: string;
  /**
   * The name of the file
   */
  name: string;
  /**
   * The file extension
   */
  extension: string;
  /**
   * The file contents
   */
  contents: string;
}