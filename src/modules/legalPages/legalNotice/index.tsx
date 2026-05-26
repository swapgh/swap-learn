import { createLegalPageMetadata, createLegalPageRoute } from "../LegalPage";
import { content } from "./content";

export const generateMetadata = createLegalPageMetadata(content, "/aviso-legal");

export default createLegalPageRoute(content, "/aviso-legal");
