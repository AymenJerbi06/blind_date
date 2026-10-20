/* Local photo processing adapter. No uploads, persistence or application state. */
const PhotoInput = (() => {
  const types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const accept = types.join(',');

  async function prepare(file) {
    if (!file || !types.includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP or GIF photo.');
    if (!file.size || file.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB.');
    const image = new Image();
    const url = URL.createObjectURL(file);
    let timer;
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('That photo could not be read. Try another image.'));
        timer = setTimeout(() => reject(new Error('That photo took too long to open. Try a smaller image.')), 10000);
        image.src = url;
      });
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) {
        throw new Error('Choose a photo up to 40 megapixels.');
      }
      const ratio = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('This browser could not prepare the photo.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.8);
        if (data.length >= 700000) throw new Error('Choose a simpler or smaller photo.');
        return data;
      } finally {
        canvas.width = canvas.height = 0;
      }
    } finally {
      clearTimeout(timer);
      image.onload = image.onerror = null;
      image.src = '';
      URL.revokeObjectURL(url);
    }
  }

  return {accept, prepare};
})();
