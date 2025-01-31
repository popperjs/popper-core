import * as React from 'react';
import useModernLayoutEffect from 'use-isomorphic-layout-effect';

function sortByDocumentPosition(a: Node, b: Node) {
  const position = a.compareDocumentPosition(b);

  if (
    position & Node.DOCUMENT_POSITION_FOLLOWING ||
    position & Node.DOCUMENT_POSITION_CONTAINED_BY
  ) {
    return -1;
  }

  if (
    position & Node.DOCUMENT_POSITION_PRECEDING ||
    position & Node.DOCUMENT_POSITION_CONTAINS
  ) {
    return 1;
  }

  return 0;
}

export const FloatingListContext = React.createContext<{
  register: (node: Node) => void;
  unregister: (node: Node) => void;
  map: Map<Node, number | null>;
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>;
  labelsRef?: React.MutableRefObject<Array<string | null>>;
}>({
  register: () => {},
  unregister: () => {},
  map: new Map(),
  elementsRef: {current: []},
});

interface FloatingListProps {
  children: React.ReactNode;
  /**
   * A ref to the list of HTML elements, ordered by their index.
   * `useListNavigation`'s `listRef` prop.
   */
  elementsRef: React.MutableRefObject<Array<HTMLElement | null>>;
  /**
   * A ref to the list of element labels, ordered by their index.
   * `useTypeahead`'s `listRef` prop.
   */
  labelsRef?: React.MutableRefObject<Array<string | null>>;
}

/**
 * Provides context for a list of items within the floating element.
 * @see https://floating-ui.com/docs/FloatingList
 */
export function FloatingList(props: FloatingListProps): React.JSX.Element {
  const {children, elementsRef, labelsRef} = props;

  const [nodes, setNodes] = React.useState(() => new Set<Node>());

  const register = React.useCallback((node: Node) => {
    setNodes((prevMap) => new Set(prevMap).add(node));
  }, []);

  const unregister = React.useCallback((node: Node) => {
    setNodes((prevMap) => {
      const map = new Set(prevMap);
      map.delete(node);
      return map;
    });
  }, []);

  const map = React.useMemo(() => {
    const newMap = new Map<Node, number>();
    const sortedNodes = Array.from(nodes.keys()).sort(sortByDocumentPosition);

    sortedNodes.forEach((node, index) => {
      newMap.set(node, index);
    });

    return newMap;
  }, [nodes]);

  return (
    <FloatingListContext.Provider
      value={React.useMemo(
        () => ({register, unregister, map, elementsRef, labelsRef}),
        [register, unregister, map, elementsRef, labelsRef],
      )}
    >
      {children}
    </FloatingListContext.Provider>
  );
}

export interface UseListItemProps {
  label?: string | null;
}

/**
 * Used to register a list item and its index (DOM position) in the
 * `FloatingList`.
 * @see https://floating-ui.com/docs/FloatingList#uselistitem
 */
export function useListItem(props: UseListItemProps = {}): {
  ref: (node: HTMLElement | null) => void;
  index: number;
} {
  const {label} = props;

  const {register, unregister, map, elementsRef, labelsRef} =
    React.useContext(FloatingListContext);

  const [index, setIndex] = React.useState<number | null>(null);

  const componentRef = React.useRef<Node | null>(null);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      componentRef.current = node;

      if (index !== null) {
        elementsRef.current[index] = node;
        if (labelsRef) {
          const isLabelDefined = label !== undefined;
          labelsRef.current[index] = isLabelDefined
            ? label
            : node?.textContent ?? null;
        }
      }
    },
    [index, elementsRef, labelsRef, label],
  );

  useModernLayoutEffect(() => {
    const node = componentRef.current;
    if (node) {
      register(node);
      return () => {
        unregister(node);
      };
    }
  }, [register, unregister]);

  useModernLayoutEffect(() => {
    const index = componentRef.current ? map.get(componentRef.current) : null;
    if (index != null) {
      setIndex(index);
    }
  }, [map]);

  return React.useMemo(
    () => ({
      ref,
      index: index == null ? -1 : index,
    }),
    [index, ref],
  );
}
