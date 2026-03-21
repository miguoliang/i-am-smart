import {
  getDeploymentSurfaceFromHeaders,
  getDeploymentSurfaceFromHostname,
  parseForwardedHost,
} from "./runtimeDeployment";

describe("runtimeDeployment", () => {
  it("parses forwarded host (first value, no port)", () => {
    expect(parseForwardedHost("preview.iamsmart.top, other", null)).toBe(
      "preview.iamsmart.top"
    );
    expect(parseForwardedHost("www.iamsmart.top:443", null)).toBe("www.iamsmart.top");
    expect(parseForwardedHost(undefined, "localhost:3000")).toBe("localhost");
  });

  it("maps iamsmart hosts to surfaces", () => {
    expect(getDeploymentSurfaceFromHostname("preview.iamsmart.top")).toBe("preview");
    expect(getDeploymentSurfaceFromHostname("www.iamsmart.top")).toBe("production");
    expect(getDeploymentSurfaceFromHostname("localhost")).toBe("other");
  });

  it("reads surface from header getter", () => {
    const headers = new Headers({
      host: "www.iamsmart.top",
    });
    expect(
      getDeploymentSurfaceFromHeaders((name) => headers.get(name))
    ).toBe("production");
  });
});
