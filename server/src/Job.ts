import { getContainedResourceUrlAll, getSolidDataset, isContainer } from "@inrupt/solid-client";

export default class Job {

    private status: 'started' | 'stopped';
    private resources: Array<string>;
    private expandedResources: Array<string>;
    // private strategy: any;
    private results: Array<string>;

    public constructor(resources: Array<string>, results: Array<string>) {
        this.status = 'stopped';
        this.results = results;
        this.resources = resources;
        this.expandedResources = new Array<string>();
    }

    public async start(): Promise<void> {
        if (this.status === 'started')
            return;

        let resource;

        while (resource = this.resources.pop()) {
            
            if (isContainer(resource)) {
                const dataset = await getSolidDataset(resource);
                const children: string[] = getContainedResourceUrlAll(dataset);
                this.expandedResources.splice(0, 0, ...children);
            }

            else {
                this.expandedResources.splice(0, 0, resource);
            }
        }
    }

    public stop(): void {
        if (this.status === 'stopped')
            return;
    }

}