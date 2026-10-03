export type CategoryOption = {
  name: string;
  slug: string;
};

export const categories: CategoryOption[] = [
  { name: "All", slug: "all" },
  { name: "BondWare", slug: "cem" },
  { name: "TileWare", slug: "tiles" },
  { name: "Home Accessories", slug: "homeaccessories" },
  { name: "ClearWare", slug: "glass" },
  { name: "CoatWare", slug: "paint" },
  { name: "ForgeWare", slug: "metal" },
  { name: "WoodWare", slug: "wood" },
  { name: "FurnitureWare", slug: "furniture" },
  { name: "FabricWare", slug: "fabric" },
  { name: "FlowWare", slug: "plumbing" },
  { name: "SafetyWare", slug: "safety" },
  { name: "ToolWare", slug: "tools" },
  { name: "PowerWare", slug: "electricals" },
  { name: "OfficeWare", slug: "office" },
];