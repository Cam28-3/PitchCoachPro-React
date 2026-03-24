import { TARGET_ZONE_LAYOUT_5X5, TARGET_ZONE_LAYOUT_BASIC, STRIKE_ZONES_5X5, STRIKE_ZONES_BASIC } from '../constants';

export default function TargetGrid({ currentGridMode, selectedTargetZoneIndex, onSelectZone }) {
  const cols = currentGridMode === 'precision' ? 5 : 4;
  const rows = currentGridMode === 'precision' ? 5 : 4;
  const strikeZones = currentGridMode === 'precision' ? STRIKE_ZONES_5X5 : STRIKE_ZONES_BASIC;

  const getZoneId = idx => {
    if (currentGridMode === 'precision') {
      return TARGET_ZONE_LAYOUT_5X5[idx];
    }
    return TARGET_ZONE_LAYOUT_BASIC[idx]?.id;
  };

  const cells = Array.from({ length: rows * cols }, (_, i) => getZoneId(i));

  return (
    <div>
      <p className="section-title">Select Target Zone</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 4,
        }}
      >
        {cells.map((zoneId, i) => {
          const isStrike = strikeZones.includes(zoneId);
          const isSelected = selectedTargetZoneIndex === zoneId;
          return (
            <button
              key={i}
              className={`target-zone-cell${isStrike ? ' strike-zone' : ' ball-zone'}${isSelected ? ' selected' : ''}`}
              style={{ height: 40 }}
              onClick={() => onSelectZone(isSelected ? null : zoneId)}
            >
              {zoneId}
            </button>
          );
        })}
      </div>
    </div>
  );
}
