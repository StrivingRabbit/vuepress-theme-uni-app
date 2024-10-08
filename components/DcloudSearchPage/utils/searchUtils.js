export function groupBy(values, predicate) {
  return values.reduce((acc, item) => {
    const key = predicate(item);

    if (!acc.hasOwnProperty(key)) {
      acc[key] = [];
    }

    // We limit each section to show 5 hits maximum.
    // This acts as a frontend alternative to `distinct`.
    if (acc[key].length < 5) {
      acc[key].push(item);
    }
    return acc;
  }, {});
}


const regexHighlightTags = /(<mark>|<\/mark>)/g;
const regexHasHighlightTags = RegExp(regexHighlightTags.source);

export function removeHighlightTags(hit) {
  const internalDocSearchHit = hit

  if (!internalDocSearchHit.__docsearch_parent && !hit._highlightResult) {
    return hit.hierarchy.lvl0;
  }
  const highlightResult = hit._highlightResult || {}

  const { value } =
    (
      internalDocSearchHit.__docsearch_parent
        ? ((internalDocSearchHit.__docsearch_parent._highlightResult || {}).hierarchy || {}).lvl0
        :(
            highlightResult.hierarchy
              || (highlightResult.hierarchy_camel || [])[0]
              || {}
          ).lvl0
    ) || {};

  let removeHighLightValue =  value && regexHasHighlightTags.test(value)
    ? value.replace(regexHighlightTags, '')
    : value;
  // if (internalDocSearchHit.tag) removeHighLightValue = `${removeHighLightValue} ${internalDocSearchHit.tag}`
  return removeHighLightValue
  // return internalDocSearchHit.tag ? internalDocSearchHit.tag : removeHighLightValue
}

export function isEditingContent(event) {
  const element = event.target;
  const tagName = element.tagName;

  return (
    element.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'SELECT' ||
    tagName === 'TEXTAREA'
  );
}
