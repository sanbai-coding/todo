import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlanStore } from '../../../store/planStore';
import { useUIStore } from '../../../store/uiStore';
import type { TagLevel, TagTone } from '../../../types';
import { TAG_TONES } from '../../../types';
import './NewTagModal.css';

export function NewTagModal() {
  const { isNewTagModalOpen, closeNewTagModal } = useUIStore();
  const { tags, addTag } = usePlanStore();
  const [tagLevel, setTagLevel] = useState<TagLevel>('L1');
  const [name, setName] = useState('');
  const [tone, setTone] = useState<TagTone>('teal');
  const [parentId, setParentId] = useState<string>('');

  const projectTags = tags.filter(t => t.level === 'L1');
  const selectedParent = projectTags.find(t => t.id === parentId);

  useEffect(() => {
    if (isNewTagModalOpen && projectTags.length > 0 && tagLevel === 'L2') {
      setParentId(projectTags[0].id);
    }
  }, [isNewTagModalOpen, tagLevel]);

  const handleClose = () => {
    setTagLevel('L1');
    setName('');
    setTone('teal');
    setParentId('');
    closeNewTagModal();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    
    if (tagLevel === 'L1') {
      addTag(name.trim(), 'L1', tone);
    } else {
      if (!parentId) {
        alert('请先选择所属项目');
        return;
      }
      addTag(name.trim(), 'L2', selectedParent?.tone || 'teal', parentId);
    }
    
    setName('');
    setTone('teal');
    setTagLevel('L1');
    closeNewTagModal();
  };

  if (!isNewTagModalOpen) return null;

  const previewName = tagLevel === 'L2' && selectedParent
    ? `${selectedParent.name} / ${name || '新分类'}`
    : name || '新项目';

  const previewTone = tagLevel === 'L2' && selectedParent
    ? TAG_TONES[selectedParent.tone]
    : TAG_TONES[tone];

  return (
    <div className="modal-mask" onClick={handleClose}>
      <div className="modal" data-level={tagLevel} onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <span className="t">新建标签</span>
          <button className="x" onClick={handleClose}>
            <X size={14} />
          </button>
        </header>

        <div className="modal-body">
          <div className="field">
            <span className="lbl">标签类型</span>
            <div className="tag-type-seg">
              <button
                className={clsx('tag-type-opt', tagLevel === 'L1' && 'on')}
                onClick={() => setTagLevel('L1')}
              >
                <span className="top">
                  项目标签
                  <span className="badge-l">L1</span>
                </span>
                <span className="desc">一级 · 用于组织月度规划的项目列</span>
              </button>
              <button
                className={clsx('tag-type-opt', tagLevel === 'L2' && 'on')}
                onClick={() => setTagLevel('L2')}
              >
                <span className="top">
                  分类标签
                  <span className="badge-l">L2</span>
                </span>
                <span className="desc">二级 · 属于某个项目，用于细分</span>
              </button>
            </div>
          </div>

          {tagLevel === 'L2' && (
            <div className="field l2-only">
              <span className="lbl">所属项目</span>
              <div className="parent-pick">
                {projectTags.map(tag => (
                  <button
                    key={tag.id}
                    className={clsx('parent-chip', parentId === tag.id && 'on')}
                    onClick={() => setParentId(tag.id)}
                  >
                    <span className="d" style={{ background: TAG_TONES[tag.tone] }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <span className="lbl">标签名称</span>
            <input
              className="txt"
              placeholder={tagLevel === 'L1' ? '如：公众号选题、快研侠' : '如：选题、写作'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {tagLevel === 'L1' && (
            <div className="field l1-only">
              <span className="lbl">标签颜色</span>
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
          )}

          {tagLevel === 'L2' && selectedParent && (
            <div className="inherit-note l2-only">
              <span className="pdot" style={{ background: TAG_TONES[selectedParent.tone] }} />
              <span>将继承父项目「<b>{selectedParent.name}</b>」的色彩</span>
            </div>
          )}
        </div>

        <footer className="modal-foot">
          <span className="preview">
            <span className="dot" style={{ background: previewTone }} />
            <span>预览：</span>
            <span className="pname">{previewName}</span>
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
