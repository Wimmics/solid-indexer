class Thing {}

function getStringNoLocale(thing: Thing, property: string): string | null {
    return null;
}

interface ILoader<T> {

    get(semanticId: string): T | null;
    // loadFromOther(Semanticable)
    // loadFromDataset(SolidDataset)
}

class ThingLoader implements ILoader<Thing> {

    get(semanticId: string): Thing | null {
        return null;
    }

}

export default abstract class SemanticObjectSolid {

    //private semanticId: string;
    private loader: ILoader<Thing>;

    //constructor(parameters: { url: string }); // load existing resource
    //constructor(parameters: { container: string, slug?: string }); // create new resource
    constructor(parameters: { url?: string, container?: string, slug?: string }) {
        //this.semanticId = semanticId;
        this.loader = new ThingLoader();
    }

    setSemanticProperty(property: string, value: any) {
        
    }

    private getThing(options?: { loader?: ILoader<Thing> }): Thing | null {
        const loader: ILoader<Thing> = options && options.loader? options.loader: this.loader;
        return loader.get(this.getSemanticId()); // Thing
    }

    getSemanticPropertyLiteral(property: string, options?: { loader?: ILoader<any> }): string | null {
        const thing: Thing | null = this.getThing(options);
        return thing? getStringNoLocale(thing, property): null;
    }

    getSemanticId(): string {
        const thing: Thing | null = this.getThing();
        return thing? getStringNoLocale(thing, "RDF.type") ?? "": "";
    }

    save() {

    }

}