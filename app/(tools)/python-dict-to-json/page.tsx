import { Metadata } from "next";
import ConverterPage from "../../(components)/ConverterPage";
import { CONVERTER_PAGES } from "@/lib/converter/pages";
import { converterMetadata } from "@/lib/converter/metadata";

const config = CONVERTER_PAGES.pythonDictToJson;

export const metadata: Metadata = converterMetadata(config);

export default function Page() {
    return <ConverterPage config={config} />;
}
