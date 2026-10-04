import {
  Action,
  ActionPanel,
  type Application,
  Color,
  getApplications,
  Icon,
  Keyboard,
  List,
  WindowManagement,
} from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { move, toggle, type AppLists } from "./filter";
import { SECTIONS, sectionOf, type Section } from "./list-sections";
import { loadLists, saveLists } from "./storage";

interface Row {
  app: Application;
  bundleId: string;
}

/** Bundle IDs of the applications with a window on the active desktop. */
async function openBundleIds(): Promise<Set<string>> {
  const windows = await WindowManagement.getWindowsOnActiveDesktop();

  return new Set(
    windows
      .map((window) => window.application?.bundleId)
      .filter((bundleId) => bundleId !== undefined),
  );
}

/** Included applications keep the include list's order, which App Priority uses; the others are alphabetical. */
function rowsIn(
  section: Section,
  rows: readonly Row[],
  lists: AppLists,
  open: ReadonlySet<string>,
): Row[] {
  const inSection = rows.filter(
    (row) => sectionOf(row.bundleId, lists, open) === section,
  );
  if (section !== "Included") return inSection;

  return inSection.sort(
    (a, b) =>
      lists.include.indexOf(a.bundleId) - lists.include.indexOf(b.bundleId),
  );
}

export default function Command() {
  const { data: apps, isLoading: loadingApps } = usePromise(getApplications);
  const { data: open, isLoading: loadingOpen } = usePromise(openBundleIds);
  const {
    data: lists,
    isLoading: loadingLists,
    mutate,
  } = usePromise(loadLists);

  const rows: Row[] = (apps ?? []).flatMap((app) =>
    app.bundleId === undefined ? [] : [{ app, bundleId: app.bundleId }],
  );
  rows.sort((a, b) => a.app.name.localeCompare(b.app.name));

  function update(next: AppLists): void {
    mutate(saveLists(next), { optimisticUpdate: () => next }).catch(
      showFailureToast,
    );
  }

  return (
    <List
      isLoading={loadingApps || loadingLists || loadingOpen}
      searchBarPlaceholder="Search applications"
    >
      {lists &&
        open &&
        SECTIONS.map((section) => (
          <List.Section
            key={section}
            title={section}
            subtitle={
              section === "Included"
                ? "Only these are tiled, in this order for App Priority"
                : section === "Open Now"
                  ? "Have a window on this desktop"
                  : undefined
            }
          >
            {rowsIn(section, rows, lists, open).map((row) => (
              <List.Item
                key={row.bundleId}
                title={row.app.name}
                subtitle={row.bundleId}
                icon={{ fileIcon: row.app.path }}
                accessories={
                  section === "Excluded"
                    ? [{ tag: { value: "Excluded", color: Color.Red } }]
                    : section === "Included"
                      ? [
                          {
                            tag: {
                              value: `Included ${String(lists.include.indexOf(row.bundleId) + 1)}`,
                              color: Color.Green,
                            },
                          },
                        ]
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
                      onAction={() => {
                        update({
                          ...lists,
                          exclude: toggle(lists.exclude, row.bundleId),
                        });
                      }}
                    />
                    <Action
                      title={
                        lists.include.includes(row.bundleId)
                          ? "Remove from Include List"
                          : "Add to Include List"
                      }
                      icon={Icon.PlusCircle}
                      onAction={() => {
                        update({
                          ...lists,
                          include: toggle(lists.include, row.bundleId),
                        });
                      }}
                    />
                    {section === "Included" && (
                      <ActionPanel.Section title="Priority">
                        <Action
                          title="Move up in Include List"
                          icon={Icon.ArrowUp}
                          shortcut={Keyboard.Shortcut.Common.MoveUp}
                          onAction={() => {
                            update({
                              ...lists,
                              include: move(lists.include, row.bundleId, -1),
                            });
                          }}
                        />
                        <Action
                          title="Move Down in Include List"
                          icon={Icon.ArrowDown}
                          shortcut={Keyboard.Shortcut.Common.MoveDown}
                          onAction={() => {
                            update({
                              ...lists,
                              include: move(lists.include, row.bundleId, 1),
                            });
                          }}
                        />
                      </ActionPanel.Section>
                    )}
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        ))}
    </List>
  );
}
