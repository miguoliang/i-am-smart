/**
 * Wraps drag listeners to prevent drag activation when clicking inside content areas.
 * 
 * This function creates new listener functions that check if a click/touch event
 * originated from a content area (marked with data-content-area="true"). If so,
 * the drag listener is not called, allowing the event to propagate to interactive
 * elements like FlipCard components.
 * 
 * @param listeners - Original drag listeners from @dnd-kit
 * @param isClickInContentArea - Function to check if a target is in a content area
 * @returns Wrapped listeners that skip drag activation for content area clicks
 */
export function wrapDragListeners(
  listeners: Record<string, unknown> | undefined,
  isClickInContentArea: (target: EventTarget | null) => boolean
): Record<string, unknown> | undefined {
  if (!listeners) return listeners;

  const wrapped: Record<string, unknown> = {};
  
  // @dnd-kit listeners are typically event handlers like onPointerDown, onMouseDown, etc.
  for (const [key, value] of Object.entries(listeners)) {
    if (typeof value === 'function') {
      // Wrap event handlers to check if click is in content area
      // Use proper type guard instead of type assertion
      const originalListener = value as (
        e: React.PointerEvent | React.MouseEvent | React.TouchEvent | Event
      ) => void;
      
      wrapped[key] = ((e: React.PointerEvent | React.MouseEvent | React.TouchEvent | Event) => {
        // Check if click/touch is in content area
        const target = 'target' in e ? e.target : null;
        if (target && isClickInContentArea(target)) {
          // Don't activate drag for content area clicks - just return without calling listener
          // Don't stop propagation or prevent default to allow click to reach FlipCard
          return;
        }
        // Call original listener for clicks outside content area
        originalListener(e);
      });
    } else {
      wrapped[key] = value;
    }
  }
  
  return wrapped;
}
