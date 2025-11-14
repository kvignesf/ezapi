declare module '*.svg' {
    import React from 'react';
    const ReactComponent: React.VFC<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}
