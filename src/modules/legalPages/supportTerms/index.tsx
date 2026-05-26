import { createLegalPageMetadata, createLegalPageRoute } from "../LegalPage";
import { content } from "./content";

export const generateMetadata = createLegalPageMetadata(content, "/support-terms");

export default createLegalPageRoute(content, "/support-terms");
