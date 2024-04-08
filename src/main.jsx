import * as React from 'react';
import { createRoot } from "react-dom/client";
// let element = (
//     <h1 id="container">
//         hello<span style={{ color: 'red' }}>world</span>
//     </h1>
// )

// function FunctionComponent() {
//     return (
//         <h1
//             onClick={(event) => console.log('父冒泡', event.currentTarget)}
//             onClickCapture={(event) => console.log('父捕获', event.currentTarget)}
//         >
//             <span
//                 onClick={(event) => {
//                     console.log('子冒泡', event.currentTarget);
//                     event.stopPropagation();
//                 }}
//                 onClickCapture={(event) => console.log('子捕获', event.currentTarget)}
//             >
//                 hello world</span>
//         </h1>
//     )
// }
function counter(state, action) {
    if (action.type === 'add') return state + 1;
    return state;
}
// function FunctionComponent() {
//     // const [number, setNumber] = React.useReducer(counter, 0);
//     const [number, setNumber] = React.useState(0);

//     return number === 0 ? (
//         <ul key='container' onClick={() => setNumber(number + 1)}>
//             <li key='A'>A</li>
//             <li key='B' id='b'>B</li>
//             <li key='C'>C</li>
//             <li key='D'>D</li>
//             <li key='E'>E</li>
//             <li key='F' id='F'>F</li>
//         </ul>
//     ) : (
//         <ul key='container' onClick={() => setNumber(number + 1)}>
//             <li key='A'>A2</li>
//             <li key='C'>C2</li>
//             <li key='E'>E2</li>
//             <li key='B' id='b2'>B2</li>
//             <li key='G'>G</li>
//             <li key='D'>D2</li>
//         </ul>
//     )
// }

// function FunctionComponent() {
//     const [number, setNumber] = React.useState(0);
//     React.useEffect(() => {
//         console.log('useEffect1');
//         return () => {
//             console.log('destroy useEffect1');
//         }
//     })
//     React.useLayoutEffect(() => {
//         console.log('useLayoutEffect2');
//         return () => {
//             console.log('destroy useLayoutEffect2');
//         }
//     })
//     React.useEffect(() => {
//         console.log('useEffect3');
//         return () => {
//             console.log('destroy useEffect3');
//         }
//     })
//     React.useLayoutEffect(() => {
//         console.log('useLayoutEffect4');
//         return () => {
//             console.log('destroy useLayoutEffect4');
//         }
//     })
//     return (
//         <button onClick={() => setNumber(number + 1)}>{number}</button>
//     )
// }

let element = <h1>hello</h1>;
// let element = <FunctionComponent />;
console.log(element);
const root = createRoot(document.getElementById('root'));
console.log(root);
// 把element虚拟dom渲染到容器中
root.render(element);
