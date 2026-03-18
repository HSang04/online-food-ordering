import React, { useEffect, useRef, useState } from "react";
import "./MapConfirmModal.css";

/**
 * MapConfirmModal
 *
 * Props:
 *  - isOpen       : boolean — hien/an modal
 *  - lat, lng     : toa do ban dau tu API geocode
 *  - diaChi       : dia chi dang nhap
 *  - onConfirm(lat, lng) : callback khi nguoi dung xac nhan vi tri
 *  - onCancel     : callback khi dong modal
 *
 * Luong:
 *  1. Mo modal -> hien marker tai (lat, lng) tu API
 *  2. Nguoi dung keo marker den vi tri dung (neu can)
 *  3. Neu keo qua 500m so voi vi tri goc -> hien canh bao
 *  4. Nhan "Xac nhan" -> goi onConfirm(lat, lng) moi
 */
const MapConfirmModal = ({ isOpen, lat, lng, diaChi, onConfirm, onCancel }) => {
  const mapRef      = useRef(null);   // div container cua ban do
  const leafletMap  = useRef(null);   // Leaflet map instance
  const markerRef   = useRef(null);   // Marker co the keo
  const circleRef   = useRef(null);   // Vong tron 500m

  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [distance,   setDistance]   = useState(0);    // m
  const [warning,    setWarning]     = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // ── Load Leaflet CSS + JS tu CDN ──────────────────────────
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }

    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Khoi tao / cap nhat ban do khi mo modal ───────────────
  useEffect(() => {
    if (!isOpen || !leafletLoaded || !mapRef.current || !lat || !lng) return;

    // Reset state
    setCurrentLat(lat);
    setCurrentLng(lng);
    setDistance(0);
    setWarning("");

    const L = window.L;

    // Destroy ban do cu neu co
    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }

    // Tao ban do moi
    const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 17);
    leafletMap.current = map;

    // Tile layer tu OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Icon cho marker co the keo
    const dragIcon = L.divIcon({
      className: "",
      html: `<div class="map-confirm-marker">
               <div class="map-confirm-marker__pin"></div>
               <div class="map-confirm-marker__pulse"></div>
             </div>`,
      iconSize:   [40, 40],
      iconAnchor: [20, 40],
    });

    // Vong tron pham vi 500m
    const circle = L.circle([lat, lng], {
      radius:      500,
      color:       "#3b82f6",
      fillColor:   "#3b82f6",
      fillOpacity: 0.08,
      weight:      2,
      dashArray:   "6 4",
    }).addTo(map);
    circleRef.current = circle;

    // Marker co the keo
    const marker = L.marker([lat, lng], {
      draggable: true,
      icon:      dragIcon,
    }).addTo(map);
    markerRef.current = marker;

    // Tooltip huong dan
    marker.bindTooltip("Kéo để điều chỉnh vị trí", {
      permanent:  false,
      direction:  "top",
      offset:     [0, -42],
    });

    // Su kien keo marker
    marker.on("dragend", (e) => {
      const newPos = e.target.getLatLng();
      const dist   = calcDistance(lat, lng, newPos.lat, newPos.lng);

      setCurrentLat(newPos.lat);
      setCurrentLng(newPos.lng);
      setDistance(Math.round(dist));

      if (dist > 500) {
        setWarning(
          `⚠️ Vị trí bạn chọn cách địa chỉ nhập ${Math.round(dist)}m. ` +
          `Nếu quá xa có thể ảnh hưởng đến giao hàng.`
        );
      } else {
        setWarning("");
      }
    });

    // Fix Leaflet render trong modal (doi DOM mount xong)
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [isOpen, leafletLoaded, lat, lng]);

  // ── Tinh khoang cach Haversine (m) ────────────────────────
  const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R    = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleConfirm = () => {
    if (distance > 500) {
      const ok = window.confirm(
        `Vị trí bạn chọn cách địa chỉ nhập ${distance}m.\n\n` +
        `Bạn có chắc muốn dùng vị trí này không?`
      );
      if (!ok) return;
    }
    onConfirm(currentLat, currentLng);
  };

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay" onClick={onCancel}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="map-modal__header">
          <div className="map-modal__title">
            <span className="map-modal__title-icon">📍</span>
            <div>
              <h3>Xác nhận vị trí giao hàng</h3>
              <p className="map-modal__subtitle">{diaChi}</p>
            </div>
          </div>
          <button className="map-modal__close" onClick={onCancel}>✕</button>
        </div>

        {/* Huong dan */}
        <div className="map-modal__hint">
          <span>💡</span>
          <span>
            Kiểm tra marker có đúng vị trí không. Nếu chưa đúng, hãy
            <strong> kéo marker</strong> đến vị trí chính xác hơn.
            Vòng tròn xanh là phạm vi chấp nhận 500m.
          </span>
        </div>

        {/* Ban do */}
        <div className="map-modal__map-wrap">
          {!leafletLoaded && (
            <div className="map-modal__loading">
              <div className="map-modal__spinner" />
              <span>Đang tải bản đồ...</span>
            </div>
          )}
          <div ref={mapRef} className="map-modal__map" />
        </div>

        {/* Thong tin vi tri */}
        <div className="map-modal__info">
          <div className="map-modal__coords">
            <span>🧭</span>
            <span>
              {currentLat?.toFixed(6)}, {currentLng?.toFixed(6)}
            </span>
          </div>
          {distance > 0 && (
            <div className={`map-modal__distance ${distance > 500 ? "danger" : "ok"}`}>
              <span>{distance > 500 ? "⚠️" : "✅"}</span>
              <span>
                Đã điều chỉnh {distance}m so với vị trí gốc
                {distance <= 500 ? " — trong phạm vi chấp nhận" : " — vượt quá 500m"}
              </span>
            </div>
          )}
        </div>

        {/* Canh bao */}
        {warning && (
          <div className="map-modal__warning">{warning}</div>
        )}

        {/* Actions */}
        <div className="map-modal__actions">
          <button className="map-modal__btn-cancel" onClick={onCancel}>
            Nhập lại địa chỉ
          </button>
          <button className="map-modal__btn-confirm" onClick={handleConfirm}>
            ✅ Xác nhận vị trí này
          </button>
        </div>

      </div>
    </div>
  );
};

export default MapConfirmModal;