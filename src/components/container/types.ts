export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Props that draggable child components should accept
 * Note: This interface is used for type checking when cloning elements.
 * The actual props passed may include additional properties like 'ref'.
 */
export interface DraggableChildProps {
  defaultPosition?: WindowPosition;
  style?: React.CSSProperties;
  "data-dragging"?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragListeners?: any;
  onMouseDown?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  // Allow ref to be passed (React.cloneElement handles this)
  ref?: React.Ref<HTMLElement>;
}
