import React, {useRef} from "react";
import {MultiTimerPlugin} from "./MultiTimerPlugin";

const MultiTimerPluginContext = React.createContext<MultiTimerPlugin|undefined>(undefined);
export function MultiTimerPluginProvider(props: { children: React.ReactNode }) {
    const ref = useRef<MultiTimerPlugin>();
    const plugin = ref.current || (ref.current = new MultiTimerPlugin());
    return (
        <MultiTimerPluginContext.Provider value={plugin}>
            {props.children}
        </MultiTimerPluginContext.Provider>
    )
}