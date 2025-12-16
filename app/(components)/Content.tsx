import { appContent } from "@/utils/variants";
import Cards from "../(components)/Cards";
import { tools } from "../utils/tools";

import Header from "../(components)/Header";

export default function Content() {
  return (
    <main className="pb-8 min-h-screen pt-10">
      {/* Header */}
      <div className={appContent({ padding: "sm" })}>
        <Header />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
          {tools.map((tool: any) => (
            <Cards key={tool.title} title={tool.title} description={tool.description} link={tool.link} icon={tool.icon} />
          ))}
        </div>
      </div>
    </main>
  );
}
