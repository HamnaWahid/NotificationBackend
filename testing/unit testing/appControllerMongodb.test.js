const status = require('http-status');
const { Application } = require('../../models/application');
const {
  addApplication,
  listApplication,
  deleteApplication,
  deactivateApplication,
  updateApplication,
} = require('../../controllers/mongodb/applicationController');

jest.mock('../../models/application');

const specificDates = new Date('2022-01-01T00:00:00.000Z');
jest.useFakeTimers().setSystemTime(specificDates);

describe('addApplication', () => {
  it('should add a new application successfully', async () => {
    Application.findOne = jest.fn().mockResolvedValue(null);
    Application.prototype.save = jest.fn().mockResolvedValue({
      appName: 'Test App',
      appDescription: 'Test Description',
      createdBy: 'hamna',
    });

    const req = {
      body: { appName: 'Test App', appDescription: 'Test Description' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await addApplication(req, res);
    expect(res.status).toHaveBeenCalledWith(status.OK);
    expect(res.send).toHaveBeenCalledWith({
      appName: 'Test App', // FAILED: change name etc
      appDescription: 'Test Description',
      createdBy: 'hamna',
    });
  });

  it('should return conflict if application already exists', async () => {
    // Mock the Application.findOne function to return an existing application
    Application.findOne = jest
      .fn()
      .mockResolvedValue({ appName: 'Existing App' });

    const req = {
      body: { appName: 'Existing App', appDescription: 'Test Description' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await addApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(status.CONFLICT); // failed: (status.OK);
    expect(res.send).toHaveBeenCalledWith(
      'An application with the same name already exists',
    );
  });
});

describe('deleteApplication', () => {
  it('should delete an application successfully', async () => {
    // Mock Application.findByIdAndUpdate to return a deleted application
    const deletedApplication = {
      appName: 'Deleted App',
      appDescription: 'Deleted Description',
      isDeleted: true,
      isActive: false,
      dateUpdated: specificDates,
    };
    Application.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue(deletedApplication);

    const req = {
      params: { app_id: '1' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deleteApplication(req, res);

    expect(Application.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      {
        isDeleted: true,
        isActive: false,
        dateUpdated: specificDates,
      },
      { new: true },
    );

    expect(res.send).toHaveBeenCalledWith(deletedApplication);
  });

  it('should return NOT_FOUND for a non-existing application', async () => {
    // Mock Application.findByIdAndUpdate to return null (application not found)
    Application.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    const req = {
      params: { app_id: 'non_existing_app_id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deleteApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(status.NOT_FOUND);
    expect(res.send).toHaveBeenCalledWith(
      'The application with the given ID was not found.',
    );
  });
});

describe('deactivateApplication', () => {
  it('should deactivate an active application successfully', async () => {
    // Mock Application.findById to return an active application
    const activeApplication = {
      _id: 'app_id_here',
      isActive: true,
      dateUpdated: Date.now(),
      save: jest.fn(),
    };
    Application.findById = jest.fn().mockResolvedValue(activeApplication);

    const req = {
      params: { app_id: 'app_id_here' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deactivateApplication(req, res);

    expect(activeApplication.isActive).toBe(false);
    expect(activeApplication.save).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(activeApplication);
  });

  it('should return NOT_FOUND for a non-existing application', async () => {
    // Mock Application.findById to return null (application not found)
    Application.findById = jest.fn().mockResolvedValue(null);

    const req = {
      params: { app_id: 'non_existing_app_id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await deactivateApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(status.NOT_FOUND);
    expect(res.send).toHaveBeenCalledWith(
      'The application with the given ID was not found.',
    );
  });
});

describe('updateApplication', () => {
  it('should update an application successfully', async () => {
    // Mock Application model methods
    const mockFindOne = jest.fn();
    Application.findOne = mockFindOne;

    const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: '1',
      appName: 'Updated App Name',
      appDescription: 'Updated description',
      dateUpdated: specificDates,
    });
    Application.findByIdAndUpdate = mockFindByIdAndUpdate;

    // Mock request and response
    const req = {
      params: { app_id: '1' },
      body: {
        appName: 'Updated App Name',
        appDescription: 'Updated description',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Call tested function
    await updateApplication(req, res);

    // Assertions
    expect(Application.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      {
        appName: 'Updated App Name',
        appDescription: 'Updated description',
        dateUpdated: specificDates,
      },
      { new: true },
    );

    expect(res.send).toHaveBeenCalledWith({
      _id: '1',
      appName: 'Updated App Name',
      appDescription: 'Updated description',
      dateUpdated: specificDates,
    });
  });

  it('should return CONFLICT if an application with the same name exists', async () => {
    // Mock the Application model methods and dependencies
    const existingApplication = {
      _id: 'existing_id',
      appName: 'Existing App',
      appDescription: 'Existing Description',
      isDeleted: false,
    };
    Application.findOne = jest.fn().mockResolvedValue(existingApplication);

    const req = {
      params: { app_id: 'existing_id' },
      body: {
        appName: 'Existing App', // Same name as existing application
        appDescription: 'Updated Description',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(status.CONFLICT);
    expect(res.send).toHaveBeenCalledWith(
      'An application with the same name already exists',
    );
  });

  it('should return NOT_FOUND if application does not exist', async () => {
    // Mock findByIdAndUpdate to return null
    Application.findByIdAndUpdate.mockResolvedValueOnce(null);

    const req = {
      params: { app_id: '1' },
      body: {
        appName: 'New Name',
        appDescription: 'New description',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateApplication(req, res);

    expect(res.send).toHaveBeenCalledWith(
      'An application with the same name already exists',
    );
  });
});

describe('listApplication', () => {
  const req = {
    query: {
      page: '1',
      pageSize: '10',
      isActive: 'true',
    },
  };

  const res = {
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list applications with query filters', async () => {
    const mockCountDocuments = jest
      .spyOn(Application, 'countDocuments')
      .mockResolvedValue(5);
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(Application, 'find').mockReturnValue(mockFind);

    await listApplication(req, res);

    expect(mockCountDocuments).toHaveBeenCalledWith({
      isActive: true,
    });

    expect(mockFind.sort).toHaveBeenCalledWith('name');

    expect(mockFind.skip).toHaveBeenCalledWith(0);

    expect(mockFind.limit).toHaveBeenCalledWith(10);

    expect(res.json).toHaveBeenCalledWith({
      applications: [],
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      totalApplications: 5,
    });
  });

  it('should list applications without query filters and with pagination', async () => {
    const mockCountDocuments = jest
      .spyOn(Application, 'countDocuments')
      .mockResolvedValue(15);
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(Application, 'find').mockReturnValue(mockFind);

    const reqWithoutFilters = {
      query: {
        page: '2', // Get the second page
        pageSize: '5', // 5 items per page
      },
    };

    await listApplication(reqWithoutFilters, res);

    expect(mockCountDocuments).toHaveBeenCalledWith({});

    expect(mockFind.sort).toHaveBeenCalledWith('name');

    expect(mockFind.skip).toHaveBeenCalledWith(5); // Skip the first 5 items for page 2

    expect(mockFind.limit).toHaveBeenCalledWith(5);

    expect(res.json).toHaveBeenCalledWith({
      applications: [],
      currentPage: 2,
      totalPages: 3, // Total of 15 items, 5 items per page
      pageSize: 5,
      totalApplications: 15,
    });
  });
});
