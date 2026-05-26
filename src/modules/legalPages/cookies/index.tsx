import { createLegalPageMetadata, createLegalPageRoute } from "../LegalPage";
import { content } from "./content";

export const generateMetadata = createLegalPageMetadata(content, "/cookies");

export default createLegalPageRoute(content, "/cookies");
