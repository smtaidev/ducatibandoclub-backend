export type TErrorDetails = {
  issues: {
    path: string | number;
    message: string;
  }[];
};

export type TGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorDetails: TErrorDetails;
};


export type IGenericErrorMessage = {
  path: string | number;
  message: string;
  errorCode?: string;
  expiredAt?: string;
  date?: string;
};
