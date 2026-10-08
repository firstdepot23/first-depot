import { SHOW_ADDRESS } from "../_data";

export function Address() {
  if (!SHOW_ADDRESS) return <div className="fd-docs-end" />;
  return (
    <footer className="fd-docs-foot">
      Visit us: Lira City, Lira City West, Barogole, Wigweng. <br />
      P. O. Box 332500, Lira, Uganda
    </footer>
  );
}
