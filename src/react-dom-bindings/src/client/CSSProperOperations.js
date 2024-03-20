
export function setValueForStyles(node, styles) {
    const { style } = node;
    //style={{ color: 'red' }}
    for (const styleName in styles) {
        if (styles.hasOwnProperty(styleName)) {
            const styleValue = styles[styleName];
            style[styleName] = styleValue;
        }
    }
}