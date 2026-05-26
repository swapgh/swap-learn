import { createPublicPageMetadata, createPublicPageRoute } from "../PublicPage";
import { content } from "./content";

export const generateMetadata = createPublicPageMetadata(content, "/games/class-select");

export default createPublicPageRoute(content);
