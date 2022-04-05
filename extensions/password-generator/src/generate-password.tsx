import { useState } from "react";
import { ActionPanel, Action, Form, Detail, showToast, Clipboard, Toast } from "@raycast/api";
import { generatePassword } from "./helpers/helpers";

interface Form {
  length: string;
  useNumbers: 1 | 0;
  useChars: 1 | 0;
}

export default function Command() {
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePassword = (values: Form) => {
    const length = values.length;
    const lengthNumber = parseInt(length, 10);

    const useNumbers = Boolean(values.useNumbers);
    const useChars = Boolean(values.useChars);
    if (!Number.isFinite(lengthNumber)) {
      setError("Password length must be a number");
      return;
    }
    if (lengthNumber < 5) {
      setError("Password length must be greater than 4");
      return;
    }
    if (lengthNumber > 64) {
      setError("Password length must be less than 65");
    }

    const generatedPassword = generatePassword(lengthNumber, useNumbers, useChars);
    Clipboard.copy(generatedPassword);
    showToast(Toast.Style.Success, "Copied Password", generatedPassword);
  };

  return (
    <>
      <Form
        navigationTitle="Password Generator"
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Generate Password" onSubmit={(values: Form) => handleGeneratePassword(values)} />
          </ActionPanel>
        }
      >
        <Form.TextField
          id="length"
          title="Enter password length (number of characters):"
          placeholder="Enter a number between 5 and 64"
        />
        <Form.Checkbox id="useNumbers" label="Use numbers?" defaultValue={true} />
        <Form.Checkbox id="useChars" label="Use special characters?" defaultValue={true} />
      </Form>
      {error && <Detail markdown={`### Error: ${error}`} />}
    </>
  );
}
