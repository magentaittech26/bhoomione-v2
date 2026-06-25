export interface DxfPoint {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TransformMatrix {
  A: number;
  B: number;
  Cx: number;
  Cy: number;
}

export class GeoReferenceService {
  /**
   * Computes 2D Conformal/Similarity transformation parameters (A, B, Cx, Cy)
   * mapping DXF Cartesian (x, y) coordinates to Geographical (lng, lat) coordinates.
   * 
   * lng = A * x - B * y + Cx
   * lat = B * x + A * y + Cy
   */
  static calculateTransform(
    anchor1Dxf: DxfPoint,
    anchor1Geo: GeoPoint,
    anchor2Dxf: DxfPoint,
    anchor2Geo: GeoPoint
  ): TransformMatrix {
    const dx = anchor2Dxf.x - anchor1Dxf.x;
    const dy = anchor2Dxf.y - anchor1Dxf.y;
    const dGeoLng = anchor2Geo.lng - anchor1Geo.lng;
    const dGeoLat = anchor2Geo.lat - anchor1Geo.lat;

    const denominator = dx * dx + dy * dy;

    if (Math.abs(denominator) < 1e-12) {
      throw new Error("Invalid anchor points. Anchors must have distinct DXF coordinates to resolve scale and rotation.");
    }

    // Solve for similarity coefficients
    const A = (dGeoLng * dx + dGeoLat * dy) / denominator;
    const B = (dGeoLat * dx - dGeoLng * dy) / denominator;

    // Resolve translations using Anchor 1
    const Cx = anchor1Geo.lng - (A * anchor1Dxf.x - B * anchor1Dxf.y);
    const Cy = anchor1Geo.lat - (B * anchor1Dxf.x + A * anchor1Dxf.y);

    return { A, B, Cx, Cy };
  }

  /**
   * Transforms DXF Cartesian coordinate point (x, y) to Real World Geographical coordinates (lat, lng).
   */
  static dxfToGeo(x: number, y: number, transform: TransformMatrix): GeoPoint {
    const lng = transform.A * x - transform.B * y + transform.Cx;
    const lat = transform.B * x + transform.A * y + transform.Cy;
    return { lat, lng };
  }

  /**
   * Performs inverse transformation from Geographical (lat, lng) to local DXF Cartesian coordinates (x, y).
   */
  static geoToDxf(lat: number, lng: number, transform: TransformMatrix): DxfPoint {
    const M = transform.A * transform.A + transform.B * transform.B;
    if (Math.abs(M) < 1e-24) {
      throw new Error("Invalid transform matrix. Scale factor is zero.");
    }

    const dLng = lng - transform.Cx;
    const dLat = lat - transform.Cy;

    const x = (transform.A * dLng + transform.B * dLat) / M;
    const y = (-transform.B * dLng + transform.A * dLat) / M;

    return { x, y };
  }
}
