import { useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlanStore } from '../../../store/planStore';
import { useUIStore } from '../../../store/uiStore';
import type { TagTone } from '../../../types';
import { TAG_TONES } from '../../../types';
import '../MonthPlanView/NewTagModal.css';

/**
 * 项目规划里的「新建项目面板」= 新建一个项目（L1 项目标签）。
 * 已有的项目在月度规划里建好之后会自动出现，不需要再单独建面板。
 */
export function NewProjectModal() {
  const { isNewBoardModalOpen, closeNewBoardModal, setBoardProject } = useUIStore();
  const { addTag } = usePlanStore();
  const [name, setName] = useState('');
  const [tone, setTone] = useState<TagTone>('teal');

  if (!isNewBoardModalOpen) return null;

  const handleClose = () => {
    setName('');
    setTone('teal');
    closeNewBoardModal();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const projectId = addTag(name.trim(), 'L1', tone);
    // 建完直接切到这个新项目的面板
    setBoardProject(projectId);
    handleClose();
  };

  return (
    <div className="modal-mask" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <span className="t">新建项目面板</span>
          <button className="x" onClick={handleClose}>
            <X size={14} />
          </button>
        </header>

        <div className="modal-body">
          <div className="field">
            <span className="lbl">项目名称</span>
            <input
              className="txt"
              placeholder="如：快研侠、公众号选题"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              autoFocus
            />
          </div>

          <div className="field">
            <span className="lbl">项目颜色</span>
            <div className="swatches">
              {(Object.keys(TAG_TONES) as TagTone[]).map(t => (
                <button
                  key={t}
                  className={clsx('sw', tone === t && 'on')}
                  style={{ background: TAG_TONES[t] }}
                  onClick={() => setTone(t)}
                />
              ))}
            </div>
          </div>

          <div className="inherit-note">
            <span className="pdot" style={{ background: TAG_TONES[tone] }} />
            <span>会同时生成一个项目标签，之后在月度规划里给它加分类，这里就会自动铺成一列一列。</span>
          </div>
        </div>

        <footer className="modal-foot">
          <span className="preview">
            <span className="dot" style={{ background: TAG_TONES[tone] }} />
            <span>预览：</span>
            <span className="pname">{name || '新项目'}</span>
          </span>
          <div className="actions">
            <button className="btn" onClick={handleClose}>取消</button>
            <button className="btn primary" onClick={handleCreate} disabled={!name.trim()}>
              创建
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
