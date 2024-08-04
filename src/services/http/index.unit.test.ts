import { IncomingMessage, ServerResponse } from 'http';
import { createServiceHttp } from ".";

const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_TEXT = { 'Content-Type': 'text/plain' };

class FakeReq extends IncomingMessage {
    constructor(overrides: Partial<IncomingMessage> = {}) {
        super(null);

        Object.assign(this, overrides);
    }
}
class FakeRes extends ServerResponse {
    constructor(req: IncomingMessage) {
        super(req);

        this.writeHead = jest.fn();
        this.end = jest.fn();
    }
}

test('Request to unsported path', () => {
    //#region Given
    const service = createServiceHttp();
    const fakeReq = new FakeReq({ url: '/foo' });
    const fakeRes = new FakeRes(fakeReq);
    //#enregion Given

    //#region When
    service.mainFunction(fakeReq, fakeRes);
    //#enregion When

    //#region Then
    expect(fakeRes.writeHead).toBeCalledWith(404, CONTENT_TYPE_TEXT);
    expect(fakeRes.end).toBeCalledWith('Not Found');
    //#enregion Then
});

test('Request to "/"', () => {
    //#region Given
    const service = createServiceHttp();
    const fakeReq = new FakeReq({ url: '/' });
    const fakeRes = new FakeRes(fakeReq);
    //#enregion Given

    //#region When
    service.mainFunction(fakeReq, fakeRes);
    //#enregion When

    //#region Then
    expect(fakeRes.writeHead).toBeCalledWith(200, CONTENT_TYPE_JSON);
    expect(fakeRes.end).toBeCalledWith('{}');
    //#enregion Then
});

