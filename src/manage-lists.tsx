import {
  Action,
  ActionPanel,
  Application,
  Color,
  getApplications,
  Icon,
  List,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { toggle, type AppLists } from "./filter";
import { loadLists, saveLists } from "./storage";

type Row = { app: Application; bundleId: string };

function section(row: Row, lists: AppLists): "Excluded" | "Included" | "Other" {
  if (lists.exclude.includes(row.bundleId)) return "Excluded";
  if (lists.include.includes(row.bundleId)) return "Included";
  return "Other";
}

export default function Command() {
  const { data: apps, isLoading: loadingApps } = usePromise(getApplications);
  const {
    data: lists,
    isLoading: loadingLists,
    mutate,
  } = usePromise(loadLists);

  const rows: Row[] = (apps ?? []).flatMap((app) =>
    app.bundleId === undefined ? [] : [{ app, bundleId: app.bundleId }],
  );
  rows.sort((a, b) => a.app.name.localeCompare(b.app.name));

  async function update(next: AppLists): Promise<void> {
    await mutate(saveLists(next), { optimisticUpdate: () => next });
  }

  return (
    <List
      isLoading={loadingApps || loadingLists}
      searchBarPlaceholder="Search applications"
    >
      {lists &&
        (["Excluded", "Included", "Other"] as const).map((title) => (
          <List.Section
            key={title}
            title={title}
            subtitle={title === "Included" ? "Only these are tiled" : undefined}
          >
            {rows
              .filter((row) => section(row, lists) === title)
              .map((row) => (
                <List.Item
                  key={row.bundleId}
                  title={row.app.name}
                  subtitle={row.bundleId}
                  icon={{ fileIcon: row.app.path }}
                  accessories={
                    title === "Excluded"
                      ? [{ tag: { value: "Excluded", color: Color.Red } }]
                      : title === "Included"
                        ? [{ tag: { value: "Included", color: Color.Green } }]
                        : []
                  }
                  actions={
                    <ActionPanel>
                      <Action
                        title={
                          lists.exclude.includes(row.bundleId)
                            ? "Remove from Exclude List"
                            : "Add to Exclude List"
                        }
                        icon={Icon.MinusCircle}
                        onAction={() =>
                          update({
                            ...lists,
                            exclude: toggle(lists.exclude, row.bundleId),
                          })
                        }
                      />
                      <Action
                        title={
                          lists.include.includes(row.bundleId)
                            ? "Remove from Include List"
                            : "Add to Include List"
                        }
                        icon={Icon.PlusCircle}
                        onAction={() =>
                          update({
                            ...lists,
                            include: toggle(lists.include, row.bundleId),
                          })
                        }
                      />
                    </ActionPanel>
                  }
                />
              ))}
          </List.Section>
        ))}
    </List>
  );
}
