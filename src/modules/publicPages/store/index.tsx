import { createPublicPageMetadata, createPublicPageRoute } from "../PublicPage";
import { content } from "./content";

export const generateMetadata = createPublicPageMetadata(content, "/store");

export default createPublicPageRoute(content);
