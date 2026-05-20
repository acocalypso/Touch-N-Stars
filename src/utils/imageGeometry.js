export function calculateContainedImageBounds(imageElement, containerElement, imageRotation) {
  if (!imageElement || !containerElement) return null;

  const imageRect = imageElement.getBoundingClientRect();
  const containerRect = containerElement.getBoundingClientRect();
  const naturalWidth = imageElement.naturalWidth;
  const naturalHeight = imageElement.naturalHeight;

  if (!imageRect.width || !imageRect.height || !naturalWidth || !naturalHeight) {
    return null;
  }

  const normalizedRotation = ((imageRotation % 360) + 360) % 360;
  const isSideways = normalizedRotation === 90 || normalizedRotation === 270;
  const imageAspectRatio = isSideways ? naturalHeight / naturalWidth : naturalWidth / naturalHeight;
  const boundsAspectRatio = imageRect.width / imageRect.height;

  let renderedWidth = imageRect.width;
  let renderedHeight = imageRect.height;

  if (imageAspectRatio > boundsAspectRatio) {
    renderedHeight = imageRect.width / imageAspectRatio;
  } else {
    renderedWidth = imageRect.height * imageAspectRatio;
  }

  const horizontalInset = (imageRect.width - renderedWidth) / 2;
  const verticalInset = (imageRect.height - renderedHeight) / 2;

  return {
    left: imageRect.left - containerRect.left + horizontalInset,
    top: imageRect.top - containerRect.top + verticalInset,
    width: renderedWidth,
    height: renderedHeight,
  };
}

export function clientPointToNaturalPoint({
  clientX,
  clientY,
  imageElement,
  containerElement,
  imageRotation,
}) {
  const bounds = calculateContainedImageBounds(imageElement, containerElement, imageRotation);
  if (!bounds || !imageElement) return null;

  const naturalWidth = imageElement.naturalWidth;
  const naturalHeight = imageElement.naturalHeight;
  if (!naturalWidth || !naturalHeight) return null;

  const containerRect = containerElement.getBoundingClientRect();
  const localX = clientX - containerRect.left - bounds.left;
  const localY = clientY - containerRect.top - bounds.top;

  if (localX < 0 || localY < 0 || localX > bounds.width || localY > bounds.height) {
    return null;
  }

  const u = localX / bounds.width;
  const v = localY / bounds.height;

  const normalizedRotation = ((imageRotation % 360) + 360) % 360;
  let naturalX;
  let naturalY;
  switch (normalizedRotation) {
    case 90:
      naturalX = v * naturalWidth;
      naturalY = (1 - u) * naturalHeight;
      break;
    case 180:
      naturalX = (1 - u) * naturalWidth;
      naturalY = (1 - v) * naturalHeight;
      break;
    case 270:
      naturalX = (1 - v) * naturalWidth;
      naturalY = u * naturalHeight;
      break;
    default:
      naturalX = u * naturalWidth;
      naturalY = v * naturalHeight;
  }

  return {
    naturalX,
    naturalY,
    naturalWidth,
    naturalHeight,
    localX,
    localY,
    bounds,
  };
}
