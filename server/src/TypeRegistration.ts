import SemanticObjectSolid from "./SemanticObjectSolid";

export default class TypeRegistration extends SemanticObjectSolid {

    constructor(parameters: { url: string }); // load existing resource
    constructor(parameters: { container: string, slug?: string, type?: string, instance?: string }); // create new resource
    constructor(parameters: { url?: string, container?: string, slug?: string, type?: string, instance?: string}) {
        super(parameters);
    }

    getClass(): string | null {
        return this.getSemanticPropertyLiteral("solid:forClass");
    }

    getInstance(): string {
        return "";
    }

    setClass(newClass: string, options?: { save?: boolean }) {
        this.setSemanticProperty("solid:forClass", newClass);
        if (options) {
            if (options.save) this.save();
        }
    }

    setInstance(instance: string) {

    }

}