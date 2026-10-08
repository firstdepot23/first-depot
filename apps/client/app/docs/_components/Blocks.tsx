import type { Block } from "../_data/schema";
import { Inline } from "./Inline";

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
          case "h3":
            return (
              <h3 key={i}>
                <Inline text={block.text} />
              </h3>
            );
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre key={i} tabIndex={0}>
                <code>{block.code}</code>
              </pre>
            );
          case "table":
            return (
              <div className="fd-docs-table" key={i}>
                <table>
                  <thead>
                    <tr>
                      {block.head.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, k) => (
                          <td key={k}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "note":
            return (
              <p className="fd-docs-note" key={i}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </>
  );
}
