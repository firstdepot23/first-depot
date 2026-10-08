import { company as c } from "./company";
import { p, ul, note, type DocPage } from "./schema";

export const products: DocPage = {
  slug: "products",
  title: "Products",
  subtitle: "Everything for the home and the building site",
  blurb: "what we stock",
  group: "Build and shop",
  updated: "October 2026",
  intro: [
    p(
      `Here is a guide to the main product families we stock. Stock changes often, so check the shop or call us for today's availability and prices.`,
    ),
  ],
  sections: [
    {
      id: "paints",
      title: "Paints and coatings",
      blocks: [
        p(
          `Quality paints at affordable prices are where First Depot began. We stock products for interior and exterior walls, wood and metal, and offer colour matching in the showroom.`,
        ),
        ul(
          "Interior and exterior emulsion",
          "Gloss and satin enamel",
          "Primers, undercoats and wall fillers",
          "Wood stains, varnishes and sealers",
          "Brushes, rollers, trays, masking tape and thinners",
        ),
      ],
    },
    {
      id: "electricals",
      title: "Electricals",
      blocks: [
        p(
          `Safe, certified electrical products for new builds, rewiring and maintenance.`,
        ),
        ul(
          "Cables, conduit and trunking",
          "Sockets, switches and distribution boards",
          "Circuit breakers, fuses and surge protection",
          "LED bulbs, tubes and fittings",
          "Extension leads, plugs and adaptors",
        ),
        note(`Electrical installation should always be carried out by a qualified electrician.`),
      ],
    },
    {
      id: "pumps-plumbing",
      title: "Pumps and plumbing",
      blocks: [
        p(
          `Everything to move, store and control water around your property.`,
        ),
        ul(
          "Surface and submersible water pumps",
          "Water tanks, floats and fittings",
          "PVC and PPR pipes, elbows, tees and valves",
          "Taps, mixers, basins and toilets",
          "Sealants, tape and solvent cement",
        ),
      ],
    },
    {
      id: "tiles",
      title: "Tiles and flooring",
      blocks: [
        p(
          `Floor and wall finishes in a range of sizes and styles, along with everything needed to lay them.`,
        ),
        ul(
          "Ceramic and porcelain floor tiles",
          "Wall tiles for kitchens and bathrooms",
          "Tile adhesive, grout and spacers",
          "Trims, skirting and edging",
        ),
      ],
    },
    {
      id: "building-materials",
      title: "Building materials",
      blocks: [
        p(
          `Core materials for foundations, walls and roofs, delivered to site in bulk.`,
        ),
        ul(
          "Cement, sand and aggregates",
          "Steel reinforcement and binding wire",
          "Iron sheets and roofing accessories",
          "Timber and boards",
          "Plaster, gypsum board and ceiling materials",
        ),
      ],
    },
    {
      id: "hardware-tools",
      title: "General hardware and tools",
      blocks: [
        p(`The small things that keep a job moving.`),
        ul(
          "Hand tools and power tools",
          "Nails, screws, bolts and anchors",
          "Locks, hinges and door furniture",
          "Ladders, wheelbarrows and site equipment",
          "Safety gear: gloves, boots, goggles and helmets",
        ),
      ],
    },
    {
      id: "services",
      title: "Advice and extras",
      blocks: [
        p(
          `Not sure what you need? Bring your plans, photos or measurements and our team will help you choose, calculate quantities and plan delivery. Trade customers can also ask for quotes and scheduled deliveries.`,
        ),
        p(
          `Talk to us on [${c.phone}](tel:${c.phoneHref}), by [WhatsApp](${c.whatsappHref}), or visit the [Contacts](/docs/contacts) page.`,
        ),
      ],
    },
  ],
};
