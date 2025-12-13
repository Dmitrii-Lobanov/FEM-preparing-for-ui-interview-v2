import "./reset.css";
import css from "./app.module.css";
import { ToastProvider, useToast } from "./done/toast/toast.react";

import { useState } from "react";

import { CheckboxTreeExample } from "./done/nested-checkboxes/checkboxes.react";
import { AccordionExample } from "./done/accordion/accordion.react";
import { TabsExample } from "./done/tabs/tabs.react";
import { TooltipExample } from "./done/tooltip/tooltip.react";
import { TableExample } from "./done/table/table.react";
import { MarkdownExample } from "./done/markdown/markdown.react";
import { ProgressBarExample } from "./done/progress-bar/progress-bar.react";
import { SquareGameExample } from "./done/square-game/square-game.react";
import { UploadComponentExample } from "./done/upload-component/upload-component.react";
import { InfiniteCanvas } from "./in-progress/infinite-canvas/infinite-canvas.react";
import { GalleryExample } from "./in-progress/gallery/gallery.react";


const EXAMPLES = {
    toast: {
        id: "toast",
        name: "Toast",
        component: ToastExample,
    },
    checkbox: {
        id: "checkbox",
        name: "Checkbox",
        component: CheckboxTreeExample,
    },
    accordion: {
        id: "accordion",
        name: "Accordion",
        component: AccordionExample,
    },
    tabs: {
        id: "tabs",
        name: "Tabs",
        component: TabsExample,
    },
    tooltip: {
        id: "tooltip",
        name: "Tooltip",
        component: TooltipExample,
    },
    table: {
        id: "table",
        name: "Table",
        component: TableExample,
    },
    markdown: {
        id: "markdown",
        name: "Markdown",
        component: MarkdownExample,
    },
    squareGame: {
        id: "squareGame",
        name: "Square Game",
        component: SquareGameExample,
    },
    progressBar: {
        id: "progressBar",
        name: "Progress Bar",
        component: ProgressBarExample,
    },
    uploadComponent: {
        id: "uploadComponent",
        name: "Upload Component",
        component: UploadComponentExample,
    },
    infiniteCanvas: {
        id: "infiniteCanvas",
        name: "Infinite Canvas",
        component: InfiniteCanvas,
    },
    gallery: {
        id: "gallery",
        name: "Gallery",
        component: GalleryExample,
    },
} as const;

type ExampleId = keyof typeof EXAMPLES;

export default function App() {
    // Read initial selection from URL param
    const getInitialExample = (): ExampleId => {
        const params = new URLSearchParams(window.location.search);
        const example = params.get('example');
        if (example && example in EXAMPLES) {
            return example as ExampleId;
        }
        return "tabs";
    };

    const [selectedExampleId, setSelectedExampleId] = useState<ExampleId>(getInitialExample);
    const ExampleComponent = EXAMPLES[selectedExampleId].component;

    // Update URL when selection changes
    const handleSelectExample = (id: ExampleId) => {
        setSelectedExampleId(id);
        const url = new URL(window.location.href);
        url.searchParams.set('example', id);
        window.history.replaceState({}, '', url.toString());
    };

    return (
        <div className={css.app}>
            <div className={css.container}>
                <div className={css.sidebar}>
                    <h3>Examples</h3>
                    <ul>
                        {(Object.keys(EXAMPLES) as ExampleId[]).map((id) => (
                            <li key={id}>
                                <button
                                    className={selectedExampleId === id ? css.active : ""}
                                    onClick={() => handleSelectExample(id)}
                                >
                                    {EXAMPLES[id].name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={css.content}>
                    <div id="toast-container" className={css.toastContainer}></div>
                    <ToastProvider target="#toast-container">
                        <ExampleComponent />
                    </ToastProvider>
                </div>
            </div>
        </div>
    );
}

let id = 0;

function ToastExample() {
    const { toast } = useToast();
    return (
        <button
            onClick={() =>
                toast({
                    id: `${id++}`,
                    text: `Toast message: ${id}`,
                })
            }
        >
            Click on me
        </button>
    );
}
