import { PITCH_TYPES, PITCH_TYPE_COLORS } from '../constants';

export default function PitchControls({
  currentGridMode,
  onGridModeChange,
  pitchType,
  onPitchTypeChange,
  pitchSpeed,
  onPitchSpeedChange,
  exactTarget,
  isSettingTarget,
  onSetTargetMode,
  onClearExactTarget,
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

      {/* Exact Target */}
      <div>
        <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
          Exact Target
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn"
            style={{
              flex: 1,
              fontSize: 12,
              padding: '6px 10px',
              background: isSettingTarget ? '#d97706' : exactTarget ? '#92400e' : '#1e293b',
              color: isSettingTarget || exactTarget ? '#fff' : '#94a3b8',
              border: `2px solid ${isSettingTarget ? '#f59e0b' : exactTarget ? '#d97706' : '#334155'}`,
            }}
            onClick={onSetTargetMode}
          >
            {isSettingTarget ? 'Click canvas...' : exactTarget ? 'Move Target' : 'Set Target'}
          </button>
          {exactTarget && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={onClearExactTarget}
            >
              Clear
            </button>
          )}
        </div>
        {exactTarget && (
          <p style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>
            Exact target active — zone grid disabled
          </p>
        )}
      </div>

      {/* Speed */}
      <div>
        <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
          Speed
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={40}
            max={105}
            value={pitchSpeed}
            style={{ flex: 1 }}
            onChange={e => onPitchSpeedChange(Number(e.target.value))}
          />
          <input
            type="number"
            min={40}
            max={105}
            value={pitchSpeed}
            onChange={e => {
              const val = Math.max(40, Math.min(105, Number(e.target.value)));
              if (!isNaN(val)) onPitchSpeedChange(val);
            }}
            style={{
              width: 58,
              padding: '4px 6px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
            }}
          />
          <span style={{ fontSize: 12, color: '#64748b' }}>mph</span>
        </div>
      </div>
    </div>
  );
}
