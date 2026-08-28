# Remove/Disconnect fix

Fixed:
- Remove MessCal events no longer depends on Google's privateExtendedProperty query filtering.
- Only events with MessCal's `messcalKey` private property are deleted.
- Unexpected backend errors return JSON instead of HTML.
- Disconnect updates the header badge immediately to `Google not connected`.
- Remove/disconnect buttons show disabled state while working.
