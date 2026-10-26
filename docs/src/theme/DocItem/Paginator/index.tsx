import React from 'react';
import type { PropNavigation, PropSidebarItem } from '@docusaurus/plugin-content-docs';
import { useDoc, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import DocPaginator from '@theme/DocPaginator';

export default function DocItemPaginator() {
  const { metadata } = useDoc();
  const sidebar = useDocsSidebar();
  const categoryTitles: Record<string, string> = {};
  collectCategoryTitles(sidebar?.items ?? []);

  return (
    <DocPaginator
      previous={withCategoryTitle(metadata.previous)}
      next={withCategoryTitle(metadata.next)}
    />
  );

  function collectCategoryTitles(items: readonly PropSidebarItem[]) {
    items.forEach((item) => {
      if (item.type === 'category') {
        if (item.href) {
          categoryTitles[item.href] = item.label;
        }

        collectCategoryTitles(item.items);
      }
    });
  }

  function withCategoryTitle(link: PropNavigation['previous']) {
    return link ? { ...link, title: categoryTitles[link.permalink] ?? link.title } : link;
  }
}
