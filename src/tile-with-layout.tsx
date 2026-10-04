import { Action, ActionPanel, List } from "@raycast/api";
import { LAYOUT_TITLES } from "./layouts/titles";
import { LAYOUT_IDS } from "./layouts/types";
import { runTile } from "./tile";

export default function Command() {
  return (
    <List searchBarPlaceholder="Choose a layout">
      {LAYOUT_IDS.map((id) => (
        <List.Item
          key={id}
          title={LAYOUT_TITLES[id]}
          icon={{
            source: {
              light: `layout-${id}.png`,
              dark: `layout-${id}@dark.png`,
            },
          }}
          actions={
            <ActionPanel>
              <Action
                title="Tile Windows"
                onAction={() => {
                  void runTile("desktop", id);
                }}
              />
              <Action
                title="Tile App"
                onAction={() => {
                  void runTile("current-app", id);
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
