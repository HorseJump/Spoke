import renderIndex from "./render-index";
import wrap from "../wrap";
import fs from "fs";
import path from "path";
import {ASSETS_DIR, ASSETS_MAP_FILE} from "dotenv"

const DEBUG =
  process.env.NODE_ENV === "development" || !!process.env.WEBPACK_HOT_RELOAD;

let assetMap = {
  "bundle.js": "/assets/bundle.js"
};

console.log(`ASSETS_DIR:${ASSETS_DIR}`);
console.log(`ASSETS_MAP_FILE:${ASSETS_MAP_FILE}`);
console.log(`__dirname:${__dirname}`);

if (!DEBUG) {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      // this is a bit overly complicated for the use case
      // of it being run from the build directory BY claudia.js
      // we need to make it REALLY relative, but not by the
      // starting process or the 'local' directory (which are both wrong then)
      (ASSETS_DIR || "").startsWith(".")
        ? path.join(
            __dirname,
            "../../../../",
            ASSETS_DIR,
            ASSETS_MAP_FILE
          )
        : path.join(ASSETS_DIR, ASSETS_MAP_FILE)
    )
  );
  const staticBase = process.env.STATIC_BASE_URL || "/assets/";
  for (var a in assetMapData) {
    assetMap[a] = staticBase + assetMapData[a];
  }
}

export default wrap(async (req, res) => {
  const query = req._parsedUrl.search
    ? encodeURIComponent(req._parsedUrl.search || "")
    : "";
  const loginPaths = {
    addOrganization: 1,
    admin: 1,
    app: 1,
    invite: 1,
    join: 1,
    organizations: 1,
    reset: 1
  };
  const [_, firstToken, secToken] = req.path.split("/");
  if (
    !req.isAuthenticated() &&
    (firstToken in loginPaths || secToken === "join")
  ) {
    res.redirect(302, `/login?nextUrl=${req.path}${query}`);
    return;
  }
  res.send(renderIndex("", "", assetMap));
});
