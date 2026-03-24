import { PITCH_TYPES, PITCH_TYPE_COLORS } from '../constants';

export default function PitchControls({
  currentGridMode,
  onGridModeChange,
  pitchType,
  onPitchTypeChange,
  pitchSpeed,
  onPitchSpeedChange,
}) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p className="section-title">Pitch Settings</p>

      {/* Grid Mode Toggle */}
      <div>
        <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
          Grid Mode
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn ${currentGridMode === 'precision' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
            onClick={() => onGridModeChange('precision')}
          >
            Precision (5×5)
          </button>
          <button
            className={`btn ${currentGridMode === 'basic' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
            onClick={() => onGridModeChange('basic')}
          >
            Basic (4×4)
          </button>
        </div>
      </div>

      {/* Pitch Type */}
      <div>
        <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
          Pitch Type
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PITCH_TYPES.map(type => (
            <button
              key={type}
              className="btn"
              style={{
                fontSize: 12,
                padding: '5px 10px',
                background: pitchType === type ? PITCH_TYPE_COLORS[type] : '#1e293b',
                color: pitchType === type ? '#fff' : '#94a3b8',
                border: `2px solid ${pitchType === type ? PITCH_TYPE_COLORS[type] : '#334155'}`,
              }}
              onClick={() => onPitchTypeChange(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div>
        <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
          Speed:{' '}
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{pitchSpeed} mph</span>
        </label>
        <input
          type="range"
          min={40}
          max={105}
          value={pitchSpeed}
          onChange={e => onPitchSpeedChange(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 2 }}>
          <span>40</span>
          <span>105</span>
        </div>
      </div>
    </div>
  );
}
