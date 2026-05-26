import { createPublicPageMetadata, createPublicPageRoute } from "../PublicPage";
import { content } from "./content";

export const generateMetadata = createPublicPageMetadata(content, "/games/dark-biome");

export default createPublicPageRoute(content);
