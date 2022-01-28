import { useState, Fragment } from 'react'
import {
    ActionPanel,
    Form,
    SubmitFormAction,
    Detail,
    copyTextToClipboard,
} from '@raycast/api'

import { generatePassword } from './helpers/helpers'

export default function Command() {
    type Password = string | null | undefined
    const [password, setPassword] = useState<Password>()
    const [error, isError] = useState<boolean>(false)

    let errorMessage = ''

    const handleGeneratePassword = (values: any) => {
        console.log(values)

        const length = values.lengthinput
        const lengthNumber = parseInt(length, 10)
        console.log('lengthNumber', lengthNumber)

        const useNumbers = values.usenumbers === 1 ? true : false
        const useChars = values.usechars === 1 ? true : false

        if (
            Number.isFinite(lengthNumber) &&
            lengthNumber > 4 &&
            lengthNumber < 33
        ) {
            const generatedPassword = generatePassword(
                lengthNumber,
                useNumbers,
                useChars
            )
            console.log('generatedPassword', generatedPassword)
            setPassword(generatedPassword)
            values = {}
            copyTextToClipboard(generatedPassword)
        } else {
            isError(true)
            setPassword('Error')
            if (lengthNumber < 5) {
                errorMessage = 'Password length must be greater than 4'
            } else if (lengthNumber > 32) {
                errorMessage = 'Password length must be less than 33'
            } else if (!Number.isFinite(lengthNumber)) {
                errorMessage = 'Password length must be a number'
            }
        }
    }

    return (
        <Fragment>
            <Form
                navigationTitle="Password Generator"
                actions={
                    <ActionPanel>
                        <SubmitFormAction
                            title="Generate Password (⌘ + ↵)"
                            onSubmit={(values) =>
                                handleGeneratePassword(values)
                            }
                        />
                    </ActionPanel>
                }
            >
                <Form.TextField
                    id="lengthinput"
                    title="Enter password length (number of characters):"
                    placeholder="Enter a number between 5 and 32"
                />
                <Form.Checkbox
                    id="usenumbers"
                    label="Use numbers?"
                    defaultValue={true}
                />
                <Form.Checkbox
                    id="usechars"
                    label="Use special characters?"
                    defaultValue={true}
                />
            </Form>
            {password && !error && (
                <Fragment>
                    <Detail
                        markdown={`### Generated Password: **${password}** copied to clipboard!`}
                    />
                </Fragment>
            )}
            {error && (
                <Fragment>
                    <Detail
                        markdown={`### Error: please enter a valid number between 5 and 32`}
                    />
                </Fragment>
            )}
        </Fragment>
    )
}
