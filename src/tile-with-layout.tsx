import { Action, ActionPanel, List } from "@raycast/api";
import { LAYOUT_IDS, type LayoutId } from "./layouts/types";
import { runTile } from "./tile";

const LAYOUT_TITLES: Record<LayoutId, string> = {
  grid: "Grid",
  columns: "Columns",
  rows: "Rows",
  "main-stack": "Main and Stack",
  spiral: "Spiral",
};

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
