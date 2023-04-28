import SemanticObjectSolid from "./SemanticObjectSolid";
import TypeRegistration from "./TypeRegistration";

export default class TypeIndex extends SemanticObjectSolid  {

    private registrations: Map<string, string>;

    constructor(parameters: { url: string }); // load existing resource
    constructor(parameters: { container: string, slug?: string });
    constructor(parameters: { url?: string, container?: string, slug?: string }) {
        super(parameters);
        this.registrations = new Map<string, string>();
    }

    register(registeree: TypeRegistration) {
        //const ti = <TypeIndex> this.fetch();
        this.registrations.set(registeree.getClass()!, registeree.getInstance());
        // store the registration (cache): warning a copy of the user data is kept. Handle multiple security options (no cache = save as you go)
        // save to solid POD
    }

    unregister(registeree: TypeRegistration) {

    }

    getByClass(className: string): TypeRegistration[] {
        return [];
    }

}