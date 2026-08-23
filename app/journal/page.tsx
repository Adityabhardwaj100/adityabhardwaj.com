'use client';

import { useCallback, useRef, useState } from 'react';
import GLCanvas, { type GLCanvasHandle } from './_components/GLCanvas';
import UIOverlay from './_components/UIOverlay';
import IntroModal from './_components/IntroModal';
import DotField from './_components/DotField';
import ArticlePanel from './_components/ArticlePanel';
import type { JournalItem } from './_lib/types';
import type { GridItem } from './_webgl/GridItem';

export default function JournalPage() {
  const canvasHandleRef = useRef<GLCanvasHandle>(null);
  const [focusedItem, setFocusedItem] = useState<JournalItem | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleFocusChange = (gridItem: GridItem | null) => {
    setFocusedItem(gridItem ? gridItem.item : null);
  };

  const getFocusedCardState = useCallback(() => canvasHandleRef.current?.getFocusedCardState() ?? null, []);

  return (
    <>
      <GLCanvas ref={canvasHandleRef} onFocusChange={handleFocusChange} />
      <DotField />
      {focusedItem?.body && <ArticlePanel item={focusedItem} getState={getFocusedCardState} />}
      <UIOverlay focusedItem={focusedItem} onClose={() => canvasHandleRef.current?.exitFocus()} />
      {showIntro && <IntroModal onStart={() => setShowIntro(false)} />}
    </>
  );
}
