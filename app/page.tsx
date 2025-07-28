import { appContent } from "@/utils/variants";
import Content from "./(components)/Content";
import Header from "@/components/header";

export default function ToolsPage() {
  return (
    <>
      <Header />
      <div className={appContent()}>
        <Content />
      </div>
    </>
  );
}