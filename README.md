# About Blank

This is a community plugin for [Obsidian](https://obsidian.md/).  
Customize the empty file (New Tab) *itself* a little bit by adding "Actions" such as "Commands" and "Open files". To make these actions easier to use, it also includes various action editing features ("Icon", "Ask before execution", "Grouping"). Additionally, can register these actions as new commands.

> ![WARNING]
> The "New Tab" feature relies on undocumented Obsidian behavior and may stop working in future versions. However, the command-related features should remain usable as it is designed independently.

## Features

### Customize the New Tabs

- This plugin does not provide its own custom view when there are no tabs to display. Instead, it shows the default "New Tab" (for example, if you open a new file in this state, the "New Tab" will automatically disappear).
- In exchange, the customization options are somewhat limited. You can assign arbitrary "Commands" or "Open files" (which this plugin refers to as "Actions").
- There is also a function to hide messages and buttons that are displayed by default.

### Actions

- Actions can be configured to execute existing "Commands" or to "Open files" that you specify.
- You can also group multiple "Actions" into a single "Action". When triggered, this grouped action will display a suggester with a list of all included actions, allowing you to select which specific action you want to execute. This feature is intended to prevent "New Tab" from being cluttered with "Actions".
- Each Action can be customized with the following settings:
    - **Icon**:
        - Add a custom icon to make the action more recognizable.
    - **Ask before execution**:
        - Displays a confirmation dialog before executing the action.
        - This helps prevent "Action" from malfunctioning.
    - **Register as a command**:
        - Register the action as a new command in Obsidian.
    - **Display**:
        - Display the action in the "New Tab" or not.
        - This corresponds to the case where you want to register it as a pure command without displaying it in the "New Tab".

### Quick Actions

- This feature groups actions added to the "New Tab" as a suggester and registers them as a new command `About Blank: Quick actions`.
- You can call these actions without accessing the "New Tab".

## Notes

- If commands are not properly reflected after registering or unregistering them, please reload Obsidian.
- This plugin applies CSS by default to hide the messages and buttons on the "New Tab". If the processing for the "New Tab" fails to work properly, nothing may be displayed on the "New Tab".
- You can disable "New Tab" and "Quick actions" features by turning off the "Add actions to New Tabs" setting. This is useful if you only want to use the command-related features or if these features stop working in future versions.
