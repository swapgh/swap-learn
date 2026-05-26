import { createLegalPageMetadata, createLegalPageRoute } from "../LegalPage";
import { content } from "./content";

export const generateMetadata = createLegalPageMetadata(content, "/privacy");

export default createLegalPageRoute(content, "/privacy");
