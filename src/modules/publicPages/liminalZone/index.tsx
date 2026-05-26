import { createPublicPageMetadata, createPublicPageRoute } from "../PublicPage";
import { content } from "./content";

export const generateMetadata = createPublicPageMetadata(content, "/games/liminal-zone");

export default createPublicPageRoute(content);
