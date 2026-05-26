import { createLegalPageMetadata, createLegalPageRoute } from "../LegalPage";
import { content } from "./content";

export const generateMetadata = createLegalPageMetadata(content, "/payment-disclaimer");

export default createLegalPageRoute(content, "/payment-disclaimer");
